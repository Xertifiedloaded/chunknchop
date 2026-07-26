import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
  Package,
  Snowflake,
  Leaf,
  Sparkle,
  CheckCircle,
} from 'lucide-react';
const BADGES = [
  { label: 'Every Cut Certified' },
  { label: 'Cold Chain Delivery' },
  { label: '100% Organic' },
];
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
const TESTIMONIALS = [
  {
    quote: 'The freshness is unreal. My weekend jollof-and-suya nights are on a whole other level.',
    name: 'Adaeze O.',
    location: 'Lekki, Lagos',
    initial: 'A',
    avatarBg: 'bg-[#F5D7C8] text-[#B5502E]',
  },
  {
    quote:
      'Cleanly packaged, always on time, and portions are exactly what I ask for. Never going back.',
    name: 'Tunde B.',
    location: 'Ikoyi, Lagos',
    initial: 'T',
    avatarBg: 'bg-neutral-200 text-neutral-500',
  },
  {
    quote:
      'Feeding a family of five just got easier. The subscription is genuinely worth every naira.',
    name: 'Chiamaka E.',
    location: 'Yaba, Lagos',
    initial: 'C',
    avatarBg: 'bg-[#F7D9CF] text-[#C4593A]',
  },
];
const REASONS = [
  {
    title: 'Certified Quality',
    description:
      'Every cut is processed under strict hygiene and food safety standards, ensuring premium quality you can trust.',
  },
  {
    title: 'Cold Chain Freshness',
    description:
      'Our temperature-controlled storage and delivery system keeps every product fresh from processing to your doorstep.',
  },
  {
    title: 'Expertly Portioned',
    description:
      'Professionally trimmed, portioned, and vacuum-sealed for convenience, freshness, and less kitchen prep.',
  },
  {
    title: 'Convenient Delivery',
    description:
      'Order online and enjoy fast, reliable delivery or pick up your order at one of our retail locations.',
  },
  {
    title: 'Wide Product Selection',
    description:
      'From premium beef, chicken, seafood and goat meat to BBQ packs, sausages, dairy products, and everyday kitchen essentials.',
  },
  {
    title: 'Trusted by Families',
    description:
      'We help households, restaurants, and food businesses enjoy safe, consistent, and premium-quality meat every day.',
  },
];
export { BADGES, REASONS, STEPS, FEATURES, statusSteps, TESTIMONIALS };
