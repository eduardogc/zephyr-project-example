import { Link } from 'react-router';
import { ApiRequestError } from '@shop/api-client';
import { ErrorState } from '@shop/ui';

type Props = { error: unknown; onRetry: () => void };

/** A missing product is a normal outcome (dead link): say so and offer a way out. Anything else is retryable. */
export function ProductError({ error, onRetry }: Props) {
  if (error instanceof ApiRequestError && error.status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-brand underline">
          Back to the shop
        </Link>
      </div>
    );
  }
  return <ErrorState message="We couldn't load this product." onRetry={onRetry} />;
}
