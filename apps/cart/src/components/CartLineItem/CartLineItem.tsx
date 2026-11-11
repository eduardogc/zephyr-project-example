import { Link } from 'react-router';
import { formatPrice } from '@shop/types';
import { Button, MinusIcon, PlusIcon, TrashIcon } from '@shop/ui';
import { ProductPhoto } from '@shop/ui/product-photo';
import type { CartLine } from '../../store/cartStore';

const MAX_PER_PRODUCT = 10;

type Props = {
  line: CartLine;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
};

/**
 * One cart row, plain flexbox. The DOM order (photo, name, quantity, price, remove) is also the visual and
 * tab order on every screen size:
 * - mobile: a column of two rows. Row 1: photo + name. Row 2: quantity, price (pushed right), remove.
 * - `sm` and up: a single row.
 */
export function CartLineItem({ line: { product, quantity }, onChangeQuantity, onRemove }: Props) {
  const max = Math.min(MAX_PER_PRODUCT, product.stock);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ProductPhoto product={product} className="size-16 shrink-0 rounded-lg text-3xl" />
        <div className="min-w-0 flex-1">
          <Link to={`/products/${product.id}`} className="font-medium hover:underline">
            {product.name}
          </Link>
          <p className="text-sm text-muted">{formatPrice(product.priceCents)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div role="group" aria-label={`Quantity of ${product.name}`} className="flex items-center rounded-lg border border-border">
          <Button variant="ghost" aria-label="Decrease quantity" onClick={() => onChangeQuantity(quantity - 1)}>
            <MinusIcon aria-hidden className="size-4" />
          </Button>
          <output className="w-6 text-center">{quantity}</output>
          <Button variant="ghost" aria-label="Increase quantity" disabled={quantity >= max} onClick={() => onChangeQuantity(quantity + 1)}>
            <PlusIcon aria-hidden className="size-4" />
          </Button>
        </div>
        <p className="ml-auto font-medium sm:ml-0 sm:w-20 sm:text-right">{formatPrice(product.priceCents * quantity)}</p>
        <Button variant="ghost" className="-mr-2 sm:mr-0" aria-label={`Remove ${product.name}`} onClick={onRemove}>
          <TrashIcon aria-hidden className="size-5" />
        </Button>
      </div>
    </li>
  );
}
