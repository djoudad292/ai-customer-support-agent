import { accumulateGraphState } from './agent.service';

describe('accumulateGraphState', () => {
  it('folds stream chunks into a single state object with all keys present', () => {
    const updates = [
      { understand: { sentiment: 'greeting' } },
      { decideAction: { pendingAction: 'create_ticket', pendingActionData: {} } },
      {
        createTicket: {
          actionSummary: 'Support ticket created: TKT-0001',
          executed: [
            { type: 'ticket', ok: true, id: 'TKT-0001', detail: 'Priority MEDIUM · billing' },
          ],
        },
      },
      { respond: { response: 'Done.', responseMetadata: { type: 'confirmation' } } },
    ];
    const state = accumulateGraphState(updates);

    expect(state.sentiment).toBe('greeting');
    expect(state.pendingAction).toBe('create_ticket');
    expect(state.pendingActionData).toEqual({});
    expect(state.actionSummary).toBe('Support ticket created: TKT-0001');
    expect(state.response).toBe('Done.');
    expect(state.responseMetadata).toEqual({ type: 'confirmation' });
    expect(state.executed).toHaveLength(1);
    expect(state.executed[0]).toEqual({
      type: 'ticket',
      ok: true,
      id: 'TKT-0001',
      detail: 'Priority MEDIUM · billing',
    });
  });

  it('does not clear a field when a later chunk omits it', () => {
    const updates = [
      { createTicket: { actionSummary: 'Support ticket created: TKT-0001' } },
      { respond: { response: 'Done.' } },
    ];
    const state = accumulateGraphState(updates);

    expect(state.actionSummary).toBe('Support ticket created: TKT-0001');
    expect(state.response).toBe('Done.');
  });

  it('does not wipe existing keys when a chunk value is undefined or null', () => {
    const updates = [
      { decideAction: { pendingAction: 'create_ticket' } },
      { decideAction: undefined },
      { decideAction: null },
    ];
    const state = accumulateGraphState(updates);

    expect(state.pendingAction).toBe('create_ticket');
  });

  it('returns an empty object for empty input', () => {
    expect(accumulateGraphState([])).toEqual({});
  });
});
