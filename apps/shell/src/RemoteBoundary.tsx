import { Component, Suspense, type ReactNode } from 'react';
import { ErrorState, Skeleton } from '@shop/ui';

type State = { failed: boolean };

/** Isolates a micro-frontend: if its remote is down or throws, the rest of the shell keeps working. */
export class RemoteBoundary extends Component<{ name: string; children: ReactNode; inline?: boolean }, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(`[shell] remote "${this.props.name}" failed`, error);
  }
  render() {
    if (this.state.failed) {
      return this.props.inline ? (
        <span className="text-sm text-danger">{this.props.name} unavailable</span>
      ) : (
        <ErrorState message={`The ${this.props.name} section is temporarily unavailable.`} onRetry={() => this.setState({ failed: false })} />
      );
    }
    return (
      <Suspense fallback={this.props.inline ? <Skeleton className="h-9 w-20" /> : <Skeleton className="h-96" />}>
        {this.props.children}
      </Suspense>
    );
  }
}
