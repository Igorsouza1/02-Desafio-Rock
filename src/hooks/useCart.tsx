import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    //Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      //por ser um valor string precisa ser transaformado em JSON
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // verificar se o produto existe no carrinho
      // Para ou incrementar ou adicionar no carrinho
      // Verificar quantidade no stock

      //Criando um novo array a partir do que tem do carrinho
      const updatedCart = [...cart]

      //Verifica se o produto existe
      const productExistCart = updatedCart.find(product => product.id == productId)
      
      //verificação de stock
      //Busca o produto com o id correspondente
      const productStock = await api.get(`/stock/${productId}`)
      const amountStock = productStock.data.amount

      //quantidade atual do produto no carrinho
      const currentAmount = productExistCart ? productExistCart.amount : 0
      //quantidade deseja
      const amount = currentAmount + 1
      
      if(amount > amountStock){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(productExistCart){
        productExistCart.amount = amount
      }else{
        //pegando o produto da api
        const product = await api.get(`/products/${productId}`)

        //criando o amount no type product
        const newProduct = {
          ...product.data,  
          amount: 1
        }
        updatedCart.push(newProduct)
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      //cria um variavel com o array cart
      const updatedCart = [...cart]
      //procura o index do produto que vai ser exlcuido
      const productIndex = updatedCart.findIndex(product => product.id === productId)

      //se o index existir
      if(productIndex >= 0) {
        //splice pode deletar, ou adicionar um novo item ao array
        //primeiro argumento de onde vai começar a deletar
        //segundo argumento a quantidade que itens que vao ser deletados
        updatedCart.splice(productIndex, 1)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return
      } 

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

        const updatedCart = [...cart]
        const productExistCart = updatedCart.find(product => product.id === productId)

      if(productExistCart){
        productExistCart.amount = amount

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        throw Error()
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
