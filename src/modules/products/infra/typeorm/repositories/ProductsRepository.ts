import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const product = await this.ormRepository.find({
      where: { id: In(products.map(prod => prod.id)) },
    });
    return product;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const existProducts = await this.findAllById(
      products.map(prod => ({ id: prod.id })),
    );
    await Promise.all(
      existProducts.map(async product => {
        const consumed = products.find(prod => prod.id === product.id);
        if (consumed && consumed.quantity) {
          const quantity = product.quantity - consumed.quantity;
          Object.assign(product, {
            quantity,
          });
          await this.ormRepository.save(product);
        }
      }),
    );
    // await this.ormRepository.save()
    return existProducts;
  }
}

export default ProductsRepository;
