<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

const props = defineProps<{ histories: any[] }>()

const dateLabel = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'numeric', day: 'numeric',
}).format(new Date(value))

const distinctHistories = computed(() => props.histories.filter((item, index, histories) => (
  index === 0 || item.price !== histories[index - 1]?.price
)))

const series = computed(() => [{
  name: '가격',
  data: distinctHistories.value.map(item => ({ x: dateLabel(item.changedAt), y: item.price })),
}])

const options = computed<ApexOptions>(() => ({
  chart: {
    type: 'line',
    height: 90,
    toolbar: { show: false },
    animations: { enabled: false },
    zoom: { enabled: false },
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  colors: ['#6656ef'],
  stroke: { curve: 'stepline', width: 2.5 },
  markers: {
    size: 4,
    colors: ['#fff'],
    strokeColors: '#6656ef',
    strokeWidth: 2,
    hover: { size: 6 },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#efedf7', strokeDashArray: 3, padding: { top: -8, right: 42, bottom: -8, left: 42 } },
  xaxis: {
    type: 'category',
    tickPlacement: 'on',
    labels: { hideOverlappingLabels: true, trim: false, style: { colors: '#9996a8', fontSize: '10px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
  },
  yaxis: { show: false, forceNiceScale: true },
  tooltip: {
    y: { formatter: (value: number) => `${new Intl.NumberFormat('ko-KR').format(value)}원` },
  },
}))
</script>

<template>
  <div class="price-history-chart">
    <VueApexCharts type="line" height="90" :options="options" :series="series"/>
  </div>
</template>
