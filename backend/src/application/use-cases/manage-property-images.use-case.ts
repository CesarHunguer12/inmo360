import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Actor } from '../../domain/ports/real-estate-repository.port';
import {
  PROPERTY_IMAGE_REPOSITORY,
  PropertyImageInput,
  PropertyImageRepository
} from '../../domain/ports/property-image-repository.port';

@Injectable()
export class ManagePropertyImagesUseCase {
  constructor(
    @Inject(PROPERTY_IMAGE_REPOSITORY)
    private readonly images: PropertyImageRepository
  ) {}

  list(actor: Actor, propertyId: string) { return this.images.list(actor, propertyId); }
  add(actor: Actor, propertyId: string, input: PropertyImageInput & { url: string; position: number }) {
    return this.images.add(actor, propertyId, input);
  }
  update(actor: Actor, propertyId: string, imageId: string, input: PropertyImageInput) {
    if (!Object.keys(input).length) throw new BadRequestException('Debe proporcionar al menos un campo para actualizar.');
    return this.images.update(actor, propertyId, imageId, input);
  }
  remove(actor: Actor, propertyId: string, imageId: string) {
    return this.images.remove(actor, propertyId, imageId);
  }
}
