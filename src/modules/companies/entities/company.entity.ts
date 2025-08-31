import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription-plan.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  supabaseUserId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.companies, { eager: true })
  @JoinColumn()
  subscription: SubscriptionPlan;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Employee, (employee) => employee.company, { cascade: true })
  employees: Employee[];

  @OneToMany(() => Role, (role) => role.company, { cascade: true })
  roles: Role[];
}
