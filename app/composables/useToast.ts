export function useToast() {
  const toast = useState('global-toast', () => '')
  let timer: ReturnType<typeof setTimeout> | undefined

  const notify = (message: string) => {
    toast.value = message
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { toast.value = '' }, 3500)
  }

  return { toast, notify }
}
