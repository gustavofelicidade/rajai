import Hero from '../components/organisms/Hero'
import ImpactMetrics from '../components/organisms/ImpactMetrics'
import FlowSection from '../components/organisms/FlowSection'
import ValueGrid from '../components/organisms/ValueGrid'
import MainLayout from '../components/templates/MainLayout'

const HomePage = () => {
  return (
    <MainLayout>
      <Hero />
      <ValueGrid />
      <ImpactMetrics />
      <FlowSection />
    </MainLayout>
  )
}

export default HomePage
