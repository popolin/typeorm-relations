import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not registered');
    }

    const existProducts = await this.productsRepository.findAllById(products);

    products.forEach(prod => {
      const existProduct = existProducts.find(pr => pr.id === prod.id);
      if (!existProduct) {
        throw new AppError(`Invalid product id ${prod.id}`, 400);
      }
      if (prod.quantity > existProduct.quantity) {
        throw new AppError(`Invalid quantity of ${existProduct.name}`, 400);
      }
    });

    const newProducts = existProducts.map(prod => {
      const receivedProduct = products.find(prod2 => prod2.id === prod.id);
      const quantity = receivedProduct ? receivedProduct.quantity : 0;
      return {
        product_id: prod.id,
        price: prod.price,
        quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: newProducts,
    });
    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
