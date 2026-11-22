import { Gauge } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import PanelHeader from './PanelHeader'
import ProgressRing from './ProgressRing'

export default function MasteryPanel({ mastery, subjectCount, level }) {
  const hasData = mastery !== null

  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader icon={Gauge} title="Knowledge progress" subtitle="Overall mastery score" />

      <div className="mt-6 flex flex-col items-center">
        <ProgressRing
          value={mastery ?? 0}
          label={hasData ? `${mastery}%` : '--'}
          sublabel={hasData ? 'overall' : 'no data yet'}
        />
        <p className="mt-5 text-center text-sm text-muted">
          {hasData
            ? `Averaged across ${subjectCount} subject areas at ${level} level.`
            : 'Finish a viva or a test and we will start measuring your progress.'}
        </p>
      </div>
    </SpotlightCard>
  )
}