import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('simple-array')
  permissions: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Company, company => company.roles, { onDelete: 'CASCADE' })
  @JoinColumn()
  company: Company;

  @ManyToMany(() => Employee, employee => employee.roles)
  employees: Employee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}