import { Metadata } from 'next'
import PricingClient from './pricing-client'

export const metadata: Metadata = {
  title: 'Tarifs - Nextudy Premium',
  description: 'Choisissez le plan Nextudy qui vous convient. Profitez de fonctionnalités illimitées avec Premium.',
}

export default function PricingPage() {
  return <PricingClient />
}
