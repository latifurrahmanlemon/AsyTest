import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../common/auth/role.enum';
import { TenantEntity } from '../database/entities/tenant.entity';
import { UserEntity } from '../database/entities/user.entity';
import { buildDataSourceOptions } from '../database/typeorm.config';

loadEnv();

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readEnvWithDefault(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value || fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueTenantSlug(
  tenantRepository: Repository<TenantEntity>,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug || 'default-tenant';
  let suffix = 1;

  while (await tenantRepository.exists({ where: { slug } })) {
    slug = `${baseSlug || 'default-tenant'}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function run(): Promise<void> {
  const email = readEnvWithDefault('SEED_ADMIN_EMAIL', 'admin@admin.com').toLowerCase();
  const password = readEnvWithDefault('SEED_ADMIN_PASSWORD', 'password');
  const fullName = process.env.SEED_ADMIN_FULL_NAME?.trim() || 'Admin';
  const tenantName = process.env.SEED_TENANT_NAME?.trim() || 'Default Tenant';
  const requestedTenantSlug =
    process.env.SEED_TENANT_SLUG?.trim() || slugify(tenantName);

  const dataSource = new DataSource({
    ...buildDataSourceOptions(),
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const tenantRepository = dataSource.getRepository(TenantEntity);
    const userRepository = dataSource.getRepository(UserEntity);

    let user = await userRepository.findOne({
      where: { email },
      relations: { tenant: true },
    });

    let tenant = user?.tenant ?? null;

    if (!tenant) {
      tenant = await tenantRepository.findOne({
        where: [{ slug: requestedTenantSlug }, { name: tenantName }],
      });
    }

    if (!tenant) {
      tenant = tenantRepository.create({
        name: tenantName,
        slug: await ensureUniqueTenantSlug(tenantRepository, requestedTenantSlug),
      });
      await tenantRepository.save(tenant);
    }

    const passwordHash = await hash(password, 10);

    if (!user) {
      user = userRepository.create({
        tenantId: tenant.id,
        fullName,
        email,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      });
    } else {
      user.tenantId = tenant.id;
      user.fullName = fullName;
      user.passwordHash = passwordHash;
      user.role = UserRole.ADMIN;
      user.isActive = true;
    }

    await userRepository.save(user);

    process.stdout.write(
      `Admin user ready: ${user.email} (tenant: ${tenant.name}, role: ${user.role})\n`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
