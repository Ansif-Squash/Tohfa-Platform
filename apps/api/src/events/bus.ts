/**
 * In-process Domain Event Bus.
 *
 * All mutating domain actions publish typed events here.
 * Delivery is fault-isolated: a subscriber failure or notification template error
 * is logged and NEVER throws back into or rolls back the publisher's business transaction.
 */
import { logger } from '../logger.js';

export interface DomainEvents {
  'farmer.application.approved': {
    userId: string;
    applicationId: string;
    tohfaFarmerId: string;
  };
  'farmer.application.rejected': {
    userId: string;
    applicationId: string;
    reason: string;
  };
  'farmer.application.info_requested': {
    userId: string;
    applicationId: string;
    steps: number[];
    message: string;
  };
  'counter_offer.received': {
    userId: string;
    listingId: string;
    offerPrice: string;
    originalPrice: string;
  };
  'counter_offer.expiring': {
    userId: string;
    listingId: string;
    hoursRemaining: number;
  };
  'goods.received': {
    userId: string;
    grnNumber: string;
    produceName: string;
    quantityKg: number;
  };
  'payout.released': {
    userId: string;
    payoutId: string;
    amount: string;
    reference: string;
  };
  'order.confirmed': {
    userId: string;
    orderId: string;
    orderNumber: string;
    totalAmount: string;
  };
  'order.dispatched': {
    userId: string;
    orderId: string;
    orderNumber: string;
  };
  'order.delivered': {
    userId: string;
    orderId: string;
    orderNumber: string;
  };
  'wallet.credited': {
    userId: string;
    amount: string;
    balance: string;
    reference: string;
  };
}

export type DomainEventName = keyof DomainEvents;

export type EventHandler<E extends DomainEventName> = (
  payload: DomainEvents[E],
  eventName: E,
) => Promise<void> | void;

export interface EventBus {
  publish<E extends DomainEventName>(eventName: E, payload: DomainEvents[E]): Promise<void>;
  subscribe<E extends DomainEventName>(eventName: E, handler: EventHandler<E>): () => void;
  clear(): void;
}

type GenericEventHandler = (payload: unknown, eventName: DomainEventName) => Promise<void> | void;

class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<DomainEventName, Set<GenericEventHandler>>();

  subscribe<E extends DomainEventName>(eventName: E, handler: EventHandler<E>): () => void {
    let set = this.handlers.get(eventName);
    if (!set) {
      set = new Set();
      this.handlers.set(eventName, set);
    }
    const genericHandler = handler as unknown as GenericEventHandler;
    set.add(genericHandler);
    return () => {
      set?.delete(genericHandler);
    };
  }

  /**
   * Publishes an event to all subscribers with fault isolation.
   * A failure in any subscriber is logged and never thrown to the caller.
   */
  async publish<E extends DomainEventName>(eventName: E, payload: DomainEvents[E]): Promise<void> {
    const set = this.handlers.get(eventName);
    if (!set || set.size === 0) {
      return;
    }

    const promises = Array.from(set).map(async (handler) => {
      try {
        await handler(payload, eventName);
      } catch (err) {
        logger.error(
          {
            err,
            eventName,
            payload,
          },
          'event handler failed (fault isolated — business transaction unaffected)',
        );
      }
    });

    await Promise.all(promises);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus: EventBus = new InProcessEventBus();
