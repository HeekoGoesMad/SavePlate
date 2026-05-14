import { ref } from 'vue'

export const infoBoxes = ref([
  { title: 'Total Saved', value: '1,240', icon: '🥑', bgColor: '#f0faf0', color: '#2da12b', desc: 'Items rescued this year' },
  { title: 'Donations', value: '85', icon: '🤝', bgColor: '#eff6ff', color: '#3b82f6', desc: 'Meals safely donated' },
  { title: 'Waste Reduced', value: '45kg', icon: '♻️', bgColor: '#fdf4ff', color: '#c026d3', desc: 'Less into landfills' },
])

export const monthlyActivity = ref(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])

export const impactStats = ref([
  { value: '320 kg', label: 'CO₂ Reduced', icon: '💨', bgColor: '#e0f2fe', color: '#0284c7' },
  { value: '1,500 L', label: 'Water Saved', icon: '💧', bgColor: '#dcfce7', color: '#16a34a' },
  { value: '$450', label: 'Money Saved', icon: '💰', bgColor: '#fef3c7', color: '#d97706' },
])
