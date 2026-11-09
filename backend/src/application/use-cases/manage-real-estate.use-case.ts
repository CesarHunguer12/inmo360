import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  Actor,
  OwnerInput,
  PreferenceInput,
  PropertyInput,
  REAL_ESTATE_REPOSITORY,
  RealEstateRepository
} from '../../domain/ports/real-estate-repository.port';

@Injectable()
export class ManageRealEstateUseCases {
  constructor(
    @Inject(REAL_ESTATE_REPOSITORY)
    private readonly repository: RealEstateRepository
  ) {}

  listOwners(actor: Actor) { return this.repository.listOwners(actor); }
  getOwner(actor: Actor, id: string) { return this.repository.getOwner(actor, id); }
  createOwner(actor: Actor, input: OwnerInput) { return this.repository.createOwner(actor, input); }
  updateOwner(actor: Actor, id: string, input: Partial<OwnerInput>) {
    if (!Object.keys(input).length) throw new ConflictException('Debe proporcionar al menos un campo para actualizar.');
    return this.repository.updateOwner(actor, id, input);
  }
  listClients(actor: Actor) { return this.repository.listClients(actor); }
  getClient(actor: Actor, id: string) { return this.repository.getClient(actor, id); }
  createProperty(actor: Actor, input: PropertyInput) { return this.repository.createProperty(actor, input); }
  updateProperty(actor: Actor, id: string, input: Partial<PropertyInput>) { return this.repository.updateProperty(actor, id, input); }
  changePropertyStatus(actor: Actor, id: string, status: string) { return this.repository.changePropertyStatus(actor, id, status); }
  getPreferences(actor: Actor) { return this.repository.getPreferences(actor); }
  savePreferences(actor: Actor, input: PreferenceInput) { return this.repository.savePreferences(actor, input); }
  listFavorites(actor: Actor) { return this.repository.listFavorites(actor); }
  addFavorite(actor: Actor, propertyId: string) { return this.repository.addFavorite(actor, propertyId); }
  removeFavorite(actor: Actor, favoriteId: string) { return this.repository.removeFavorite(actor, favoriteId); }
  createInquiry(actor: Actor, propertyId: string, message: string) { return this.repository.createInquiry(actor, propertyId, message); }
  listInquiries(actor: Actor) { return this.repository.listInquiries(actor); }
  updateInquiry(actor: Actor, id: string, status: string) { return this.repository.updateInquiry(actor, id, status); }
  createVisit(actor: Actor, propertyId: string, scheduledAt: Date, notes?: string) { return this.repository.createVisit(actor, propertyId, scheduledAt, notes); }
  listVisits(actor: Actor) { return this.repository.listVisits(actor); }
  updateVisit(actor: Actor, id: string, status: string, scheduledAt?: Date) { return this.repository.updateVisit(actor, id, status, scheduledAt); }
  listOpportunities(actor: Actor) { return this.repository.listOpportunities(actor); }
  updateOpportunityStage(actor: Actor, id: string, stage: string) { return this.repository.updateOpportunityStage(actor, id, stage); }
  createFollowUp(actor: Actor, opportunityId: string, description: string, dueAt: Date) { return this.repository.createFollowUp(actor, opportunityId, description, dueAt); }
  updateFollowUpStatus(actor: Actor, id: string, status: string) { return this.repository.updateFollowUpStatus(actor, id, status); }
  createOperation(actor: Actor, opportunityId: string, amount: number) { return this.repository.createOperation(actor, opportunityId, amount); }
  listOperations(actor: Actor) { return this.repository.listOperations(actor); }
  listCommissions(actor: Actor) { return this.repository.listCommissions(actor); }
  setCommissionRate(actor: Actor, rate: number) { return this.repository.setCommissionRate(actor, rate); }
  updateCommissionStatus(actor: Actor, id: string, status: string) { return this.repository.updateCommissionStatus(actor, id, status); }
  getDashboard(actor: Actor, from?: Date, to?: Date) { return this.repository.getDashboard(actor, from, to); }
  getReport(actor: Actor, from?: Date, to?: Date) { return this.repository.getReport(actor, from, to); }
  exportOperationsCsv(actor: Actor, from?: Date, to?: Date) { return this.repository.exportOperationsCsv(actor, from, to); }
}
