import type { Product, ProductPage, ProductQuery } from '@shop/types';
import { NotFoundError } from '../../errors';
import type { ProductsRepository } from './products.repository';

export type ProductsReader = Pick<ProductsRepository, 'list' | 'findById'>;

export class ProductsService {
  constructor(private readonly products: ProductsReader) {}

  list(query: ProductQuery): Promise<ProductPage> {
    return this.products.list(query);
  }

  async getById(id: string): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }
}
