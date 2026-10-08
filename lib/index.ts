import { ArrowRight, ShieldCheck, Clock, Truck, Package, Snowflake, Leaf, Sparkle, CheckCircle } from 'lucide-react';
const BADGES = [{ label: 'Every Cut Certified' }, { label: 'Cold Chain Delivery' }, { label: '100% Organic' }];
const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'PROCESSING', label: 'Processing', icon: Clock },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];
const STEPS = [
  {
    number: 'STEP 01',
    title: 'Choose Your Meat',
    description: 'Browse premium cuts and build the order that fits your table.',
  },
  {
    number: 'STEP 02',
    title: 'Expertly Prepared',
    description: 'Our butchers portion, clean, and vacuum-seal to order.',
  },
  {
    number: 'STEP 03',
    title: 'Delivered Fresh',
    description: 'Cold-chain delivered same day — right to your door.',
  },
];
const FEATURES = [
  {
    title: 'Certified Processing',
    subtitle: 'HACCP STANDARD FACILITY',
    icon: ShieldCheck,
  },
  {
    title: 'Fresh Daily',
    subtitle: 'PORTIONED EVERY MORNING',
    icon: Sparkle,
  },
  {
    title: 'Fast Delivery',
    subtitle: 'SAME-DAY ACROSS LAGOS',
    icon: Snowflake,
  },
  {
    title: 'Secure Payment',
    subtitle: 'ENCRYPTED CHECKOUT',
    icon: ShieldCheck,
  },
  {
    title: 'Trusted by Families',
    subtitle: '12,000+ HAPPY HOMES',
    icon: Leaf,
  },
];

const REASONS = [
  {
    title: 'Certified Quality',
    description: 'Every cut is processed under strict hygiene and food safety standards, ensuring premium quality you can trust.',
  },
  {
    title: 'Cold Chain Freshness',
    description: 'Our temperature-controlled storage and delivery system keeps every product fresh from processing to your doorstep.',
  },
  {
    title: 'Expertly Portioned',
    description: 'Professionally trimmed, portioned, and vacuum-sealed for convenience, freshness, and less kitchen prep.',
  },
  {
    title: 'Convenient Delivery',
    description: 'Order online and enjoy fast, reliable delivery or pick up your order at one of our retail locations.',
  },
  {
    title: 'Wide Product Selection',
    description: 'From premium beef, chicken, seafood and goat meat to BBQ packs, sausages, dairy products, and everyday kitchen essentials.',
  },
  {
    title: 'Trusted by Families',
    description: 'We help households, restaurants, and food businesses enjoy safe, consistent, and premium-quality meat every day.',
  },
];
const NAV_LINKS = [
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Categories',
    href: '/categories',
  },
  {
    label: 'Wholesale',
    href: '/wholesale',
  },
  {
    label: 'Recipes',
    href: '/recipes',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
  {
    label: 'Shop',
    href: '/shop',
  },
];

const ROLE_STYLES: Record<
  string,
  {
    label: string;
    avatar: string; // avatar circle background
    badge: string; // text/background for the small role badge
    mobileAccent: string; // background/border used for mobile menu links tied to this role
  }
> = {
  ADMIN: {
    label: 'Admin',
    avatar: 'bg-red-500',
    badge: 'bg-red-50 text-red-600',
    mobileAccent: 'bg-red-500 text-white',
  },
  SUPPLIER: {
    label: 'Supplier',
    avatar: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-600',
    mobileAccent: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  CUSTOMER: {
    label: 'Customer',
    avatar: 'bg-brand',
    badge: 'bg-brand/10 text-brand',
    mobileAccent: 'bg-neutral-50 text-[#2D2D2D]',
  },
};

const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Contact'],
  },
  {
    title: 'Shop',
    links: ['Categories', 'Bestsellers', 'BBQ Packs', 'Subscription'],
  },
  {
    title: 'Explore',
    links: ['Recipes', 'Wholesale', 'Delivery Areas', 'FAQs'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookies'],
  },
];

export { NAV_LINKS, SOCIALS, FOOTER_COLUMNS, ROLE_STYLES, BADGES, REASONS, STEPS, FEATURES, statusSteps, TESTIMONIALS };
