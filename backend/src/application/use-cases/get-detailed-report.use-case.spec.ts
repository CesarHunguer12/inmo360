import { GetDetailedReportUseCase } from './get-detailed-report.use-case';
import { REPORTS_REPOSITORY } from '../../domain/ports/reports-repository.port';

describe('GetDetailedReportUseCase', () => {
  it('passes the requested report and date filters to the persistence port', async () => {
    const repository = {
      get: jest.fn().mockResolvedValue([{ status: 'PENDIENTE' }]),
      exportCsv: jest.fn().mockResolvedValue('id,status')
    };
    const useCase = new GetDetailedReportUseCase(
      { [REPORTS_REPOSITORY]: repository }[REPORTS_REPOSITORY]
    );
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.999Z');
    const actor = { id: 'agent-id', role: 'AGENTE' as const };

    await expect(useCase.get(actor, 'visits', from, to)).resolves.toEqual([{ status: 'PENDIENTE' }]);
    await expect(useCase.exportCsv(actor, 'visits', from, to)).resolves.toBe('id,status');
    expect(repository.get).toHaveBeenCalledWith(actor, 'visits', from, to);
    expect(repository.exportCsv).toHaveBeenCalledWith(actor, 'visits', from, to);
  });
});
