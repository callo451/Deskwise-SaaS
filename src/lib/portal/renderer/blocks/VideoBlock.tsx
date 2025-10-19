import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VideoBlockProps {
  props: BlockProps
}

export function VideoBlock({ props }: VideoBlockProps) {
  const { video, style } = props

  if (!video?.src) return null

  // Detect video provider
  const isYouTube = video.src.includes('youtube.com') || video.src.includes('youtu.be')
  const isVimeo = video.src.includes('vimeo.com')

  if (isYouTube || isVimeo || video.provider === 'youtube' || video.provider === 'vimeo') {
    let embedUrl = video.src

    // Convert YouTube URLs to embed format
    if (isYouTube) {
      const videoId = video.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${video.autoplay ? '1' : '0'}&controls=${video.controls ? '1' : '0'}&loop=${video.loop ? '1' : '0'}`
      }
    }

    // Convert Vimeo URLs to embed format
    if (isVimeo) {
      const videoId = video.src.match(/vimeo\.com\/(\d+)/)?.[1]
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${video.autoplay ? '1' : '0'}&loop=${video.loop ? '1' : '0'}`
      }
    }

    return (
      <div className={cn('portal-video aspect-video', style?.className)}>
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  // Custom video
  return (
    <div className={cn('portal-video', style?.className)}>
      <video
        src={video.src}
        controls={video.controls !== false}
        autoPlay={video.autoplay}
        loop={video.loop}
        className="w-full"
      />
    </div>
  )
}
