import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { MenuCategory } from './menu.types';

/**
 * Seeded desktop mega-menu data. Swap the returned array with a Prisma query later.
 * Contract is stable: components read via getMenu() only.
 */
export async function getMenu(): Promise<MenuCategory[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('categories');

  const menu: MenuCategory[] = [
    {
      id: 'cat-mobile',
      slug: 'mobile-phones-accessories',
      parentId: null,
      sortOrder: 1,
      label: { en: 'Mobile & Accessories', bn: 'মোবাইল ও আনুষাঙ্গিক' },
      href: '/category/mobile-phones-accessories',
      columns: [
        {
          title: { en: 'Mobile Phones', bn: 'মোবাইল ফোন' },
          links: [
            { label: { en: 'Smartphones', bn: 'স্মার্টফোন' }, href: '/category/smartphones' },
            { label: { en: 'Feature Phones', bn: 'ফিচার ফোন' }, href: '/category/feature-phones' },
          ],
        },
        {
          title: { en: 'Accessories', bn: 'আনুষাঙ্গিক' },
          links: [
            { label: { en: 'Chargers & Cables', bn: 'চার্জার ও কেবল' }, href: '/category/chargers-cables' },
            { label: { en: 'Cases & Covers', bn: 'কেস ও কভার' }, href: '/category/cases-covers' },
            { label: { en: 'Screen Protectors', bn: 'স্ক্রিন প্রটেক্টর' }, href: '/category/screen-protectors' },
          ],
        },
      ],
      products: [
        {
          id: 'p-vivo-y28',
          slug: 'vivo-y28-5g',
          title: { en: 'Vivo Y28 5G', bn: 'ভিভো ওয়াই২৮ ৫জি' },
          image: '/products/product-1.svg',
          price: 26999,
          compareAtPrice: 29999,
          badge: { en: 'New', bn: 'নতুন' },
        },
        {
          id: 'p-65w-charger',
          slug: '65w-fast-charger',
          title: { en: '65W Fast Charger', bn: '৬৫ ওয়াট ফাস্ট চার্জার' },
          image: '/products/product-2.svg',
          price: 1499,
        },
        {
          id: 'p-clear-cover',
          slug: 'clear-silicone-cover',
          title: { en: 'Clear Silicone Cover', bn: 'ক্লিয়ার সিলিকন কভার' },
          image: '/products/product-3.svg',
          price: 349,
        },
      ],
    },
    {
      id: 'cat-electronics',
      slug: 'electronics',
      parentId: null,
      sortOrder: 2,
      label: { en: 'Electronics', bn: 'ইলেকট্রনিক্স' },
      href: '/category/electronics',
      columns: [
        {
          title: { en: 'Computers', bn: 'কম্পিউটার' },
          links: [
            { label: { en: 'Laptops', bn: 'ল্যাপটপ' }, href: '/category/laptops' },
            { label: { en: 'Desktops', bn: 'ডেস্কটপ' }, href: '/category/desktops' },
            { label: { en: 'Accessories', bn: 'আনুষাঙ্গিক' }, href: '/category/computer-accessories' },
          ],
        },
        {
          title: { en: 'Audio', bn: 'অডিও' },
          links: [
            { label: { en: 'Headphones', bn: 'হেডফোন' }, href: '/category/headphones' },
            { label: { en: 'Earbuds', bn: 'ইয়ারবাড' }, href: '/category/earbuds' },
            { label: { en: 'Speakers', bn: 'স্পিকার' }, href: '/category/speakers' },
          ],
        },
      ],
      products: [
        {
          id: 'p-i5-laptop',
          slug: 'core-i5-laptop',
          title: { en: 'Core i5 14" Laptop', bn: 'কোর i5 ১৪" ল্যাপটপ' },
          image: '/products/product-1.svg',
          price: 72999,
          compareAtPrice: 79999,
          badge: { en: 'New', bn: 'নতুন' },
        },
        {
          id: 'p-wireless-headphones',
          slug: 'wireless-headphones',
          title: { en: 'Wireless Headphones', bn: 'ওয়্যারলেস হেডফোন' },
          image: '/products/product-2.svg',
          price: 3499,
        },
        {
          id: 'p-bt-speaker',
          slug: 'bluetooth-speaker',
          title: { en: 'Bluetooth Speaker', bn: 'ব্লুটুথ স্পিকার' },
          image: '/products/product-3.svg',
          price: 2299,
        },
      ],
    },
    {
      id: 'cat-fashion',
      slug: 'fashion',
      parentId: null,
      sortOrder: 3,
      label: { en: 'Fashion', bn: 'ফ্যাশন' },
      href: '/category/fashion',
      columns: [
        {
          title: { en: "Men's Wear", bn: 'পুরুষদের পোশাক' },
          links: [
            { label: { en: 'Shirts', bn: 'শার্ট' }, href: '/category/mens-shirts' },
            { label: { en: 'Jeans', bn: 'জিন্স' }, href: '/category/mens-jeans' },
          ],
        },
        {
          title: { en: "Women's Wear", bn: 'নারীদের পোশাক' },
          links: [
            { label: { en: 'Dresses', bn: 'ড্রেস' }, href: '/category/womens-dresses' },
            { label: { en: 'Tops', bn: 'টপস' }, href: '/category/womens-tops' },
          ],
        },
      ],
      products: [
        {
          id: 'p-cotton-shirt',
          slug: 'mens-cotton-shirt',
          title: { en: "Men's Cotton Shirt", bn: 'পুরুষদের কটন শার্ট' },
          image: '/products/product-1.svg',
          price: 1290,
          compareAtPrice: 1590,
        },
        {
          id: 'p-summer-dress',
          slug: 'womens-summer-dress',
          title: { en: "Women's Summer Dress", bn: 'নারীদের সামার ড্রেস' },
          image: '/products/product-2.svg',
          price: 1890,
        },
        {
          id: 'p-slim-jeans',
          slug: 'slim-fit-jeans',
          title: { en: 'Slim Fit Jeans', bn: 'স্লিম ফিট জিন্স' },
          image: '/products/product-3.svg',
          price: 1990,
        },
      ],
    },
    {
      id: 'cat-home',
      slug: 'home-living',
      parentId: null,
      sortOrder: 4,
      label: { en: 'Home & Living', bn: 'ঘর ও জীবনযাপন' },
      href: '/category/home-living',
      columns: [
        {
          title: { en: 'Kitchen', bn: 'রান্নাঘর' },
          links: [
            { label: { en: 'Cookware', bn: 'রান্নার সামগ্রী' }, href: '/category/cookware' },
            { label: { en: 'Utensils', bn: 'বাসনপত্র' }, href: '/category/kitchen-utensils' },
          ],
        },
        {
          title: { en: 'Decor', bn: 'সজ্জা' },
          links: [
            { label: { en: 'Lighting', bn: 'আলো' }, href: '/category/lighting' },
            { label: { en: 'Wall Decor', bn: 'দেয়াল সজ্জা' }, href: '/category/wall-decor' },
          ],
        },
      ],
      products: [
        {
          id: 'p-cookware-set',
          slug: 'nonstick-cookware-set',
          title: { en: 'Non-stick Cookware Set', bn: 'নন-স্টিক কুকওয়্যার সেট' },
          image: '/products/product-1.svg',
          price: 3499,
          compareAtPrice: 4299,
        },
        {
          id: 'p-pendant-light',
          slug: 'led-pendant-light',
          title: { en: 'LED Pendant Light', bn: 'এলইডি পেন্ডেন্ট লাইট' },
          image: '/products/product-2.svg',
          price: 1290,
        },
        {
          id: 'p-wall-art',
          slug: 'wall-art-panel',
          title: { en: 'Wall Art Panel', bn: 'ওয়াল আর্ট প্যানেল' },
          image: '/products/product-3.svg',
          price: 890,
        },
      ],
    },
    {
      id: 'cat-beauty',
      slug: 'beauty-health',
      parentId: null,
      sortOrder: 5,
      label: { en: 'Beauty & Health', bn: 'সৌন্দর্য ও স্বাস্থ্য' },
      href: '/category/beauty-health',
      columns: [
        {
          title: { en: 'Skincare', bn: 'ত্বকের যত্ন' },
          links: [
            { label: { en: 'Cleansers', bn: 'ক্লিনজার' }, href: '/category/skincare-cleansers' },
            { label: { en: 'Moisturizers', bn: 'ময়েশ্চারাইজার' }, href: '/category/skincare-moisturizers' },
          ],
        },
      ],
      products: [
        {
          id: 'p-foaming-cleanser',
          slug: 'foaming-cleanser',
          title: { en: 'Gentle Foaming Cleanser', bn: 'জেন্টল ফোমিং ক্লিনজার' },
          image: '/products/product-1.svg',
          price: 590,
        },
        {
          id: 'p-daily-moisturizer',
          slug: 'daily-moisturizer-spf-30',
          title: { en: 'Daily Moisturizer SPF 30', bn: 'ডেইলি ময়েশ্চারাইজার SPF ৩০' },
          image: '/products/product-2.svg',
          price: 750,
          compareAtPrice: 890,
        },
      ],
    },
  ];

  return menu;
}
