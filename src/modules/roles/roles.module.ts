import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleRepository } from './repositories/role.repository';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => CompaniesModule)
  ],
  providers: [RolesService, RoleRepository],
  exports: [RolesService, RoleRepository]
})
export class RolesModule {}
