import { Button } from '../Button';
import { ExclamationTriangleIcon } from '../../icons';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-6 text-center">
      <ExclamationTriangleIcon aria-hidden className="mx-auto mb-2 size-8 text-danger" />
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
