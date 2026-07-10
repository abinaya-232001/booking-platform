import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    // Rule: booking must belong to an existing service
    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(
        `Service with id ${dto.serviceId} does not exist`,
      );
    }

    // Rule: booking dates cannot be in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(dto.bookingDate);
    if (requestedDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Bonus rule: prevent duplicate bookings for same service, date & time
    const duplicate = await this.bookingRepo.findOne({
      where: {
        serviceId: dto.serviceId,
        bookingDate: dto.bookingDate,
        bookingTime: dto.bookingTime,
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'A booking already exists for this service at the selected date and time',
      );
    }

    const booking = this.bookingRepo.create(dto);
    return this.bookingRepo.save(booking);
  }

  async findAll(query: QueryBookingDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service');

    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }
    return booking;
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Rule: cancelled bookings cannot be marked as completed
    if (
      booking.status === BookingStatus.CANCELLED &&
      dto.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cancelled bookings cannot be marked as completed',
      );
    }

    booking.status = dto.status;
    return this.bookingRepo.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }
}