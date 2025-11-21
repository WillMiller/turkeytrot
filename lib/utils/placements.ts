import type { AgeGroup, PlacementResult } from '../types/database'

export function getAgeGroup(dateOfBirth: string | null): AgeGroup | null {
  if (!dateOfBirth) return null

  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  if (age <= 12) return '0-12'
  if (age <= 17) return '13-17'
  if (age <= 29) return '18-29'
  if (age <= 39) return '30-39'
  if (age <= 49) return '40-49'
  if (age <= 59) return '50-59'
  return '60+'
}

export function calculatePlacements(raceParticipants: any[], startTime: string): PlacementResult[] {
  // Filter only participants with finish times
  const finishers = raceParticipants
    .filter(rp => rp.finish_time)
    .map(rp => {
      const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
      const start = new Date(startTime).getTime()
      const finish = new Date(finishTime).getTime()
      const elapsedTime = finish - start

      return {
        race_participant_id: rp.id,
        bib_number: rp.bib_number,
        participant: rp.participant,
        finish_time: finishTime,
        elapsed_time: elapsedTime,
        overall_place: 0,
        gender_place: null as number | null,
        age_group: getAgeGroup(rp.participant.date_of_birth),
        age_group_place: null as number | null,
        finish_time_id: rp.finish_time.id,
      }
    })
    .sort((a, b) => a.elapsed_time - b.elapsed_time)

  // Calculate overall placements
  finishers.forEach((finisher, index) => {
    finisher.overall_place = index + 1
  })

  // Calculate gender placements
  const genders = ['Male', 'Female', 'Other']
  genders.forEach(gender => {
    const genderFinishers = finishers.filter(f => f.participant.gender === gender)
    genderFinishers.forEach((finisher, index) => {
      finisher.gender_place = index + 1
    })
  })

  // Calculate age group placements
  const ageGroups: AgeGroup[] = ['0-12', '13-17', '18-29', '30-39', '40-49', '50-59', '60+']
  ageGroups.forEach(ageGroup => {
    const ageGroupFinishers = finishers.filter(f => f.age_group === ageGroup)
    ageGroupFinishers.forEach((finisher, index) => {
      finisher.age_group_place = index + 1
    })
  })

  return finishers
}

export function formatElapsedTime(elapsedMs: number): string {
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
  const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
