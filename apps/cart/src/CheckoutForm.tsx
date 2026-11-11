import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, ApiRequestError } from '@shop/api-client';
import { orderInputSchema, type Order } from '@shop/types';
import { Button } from '@shop/ui';
import { cart, type CartLine } from './cartStore';

export function CheckoutForm({ items, onSuccess }: { items: CartLine[]; onSuccess: (o: Order) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, move focus to the first invalid field so keyboard/AT users land on the problem.
  useEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  const order = useMutation({
    mutationFn: api.createOrder,
    onSuccess: (o) => {
      cart.clear();
      onSuccess(o);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.issues.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])));
      } else {
        setServerError(err.message);
      }
    },
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(undefined);
    const form = new FormData(e.currentTarget);
    const parsed = orderInputSchema.safeParse({
      customer: { name: form.get('name'), email: form.get('email'), address: form.get('address') },
      items: items.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }
    setErrors({});
    order.mutate(parsed.data);
  };

  const field = (name: 'name' | 'email' | 'address', label: string, type = 'text') => {
    const error = errors[`customer.${name}`];
    return (
      <div className="space-y-1">
        <label htmlFor={name} className="text-sm font-medium">{label} <span aria-hidden className="text-muted">*</span></label>
        <input
          id={name} name={name} type={type} autoComplete={name === 'address' ? 'street-address' : name}
          aria-required="true" aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 aria-invalid:border-danger"
        />
        {error && <p id={`${name}-error`} className="text-sm text-danger">{error}</p>}
      </div>
    );
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-labelledby="checkout-title" className="space-y-4">
      <h2 id="checkout-title" className="text-xl font-semibold">Checkout</h2>
      {field('name', 'Full name')}
      {field('email', 'Email', 'email')}
      {field('address', 'Shipping address')}
      {errors.items && <p role="alert" className="text-sm text-danger">{errors.items}</p>}
      {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
      <Button type="submit" disabled={order.isPending} className="w-full py-3">
        {order.isPending ? 'Placing order…' : 'Place order'}
      </Button>
    </form>
  );
}
