import type { PropertyFilters } from '../../domain/entities/property';
import type { PropertyRepository, PropertyWrite } from '../../domain/repositories/property.repository';

export class BrowseProperties {
  constructor(private readonly properties: PropertyRepository) {}
  execute(filters?: PropertyFilters, managed = false) {
    return this.properties.list(filters, managed);
  }
}

export class GetProperty {
  constructor(private readonly properties: PropertyRepository) {}
  execute(id: string) {
    return this.properties.get(id);
  }
}

export class SaveProperty {
  constructor(private readonly properties: PropertyRepository) {}
  execute(input: PropertyWrite, id?: string) {
    return id ? this.properties.update(id, input) : this.properties.create(input);
  }
}
