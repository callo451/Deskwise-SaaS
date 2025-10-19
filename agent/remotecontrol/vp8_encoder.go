// +build cgo

package remotecontrol

/*
#cgo CFLAGS: -IC:/msys64/mingw64/include
#cgo LDFLAGS: -LC:/msys64/mingw64/lib -lvpx -lm
#include <vpx/vpx_encoder.h>
#include <vpx/vp8cx.h>
#include <stdlib.h>
#include <string.h>

// Helper function to access frame data from union
static inline void* get_frame_buf(const vpx_codec_cx_pkt_t *pkt) {
	return pkt->data.frame.buf;
}

static inline size_t get_frame_sz(const vpx_codec_cx_pkt_t *pkt) {
	return pkt->data.frame.sz;
}
*/
import "C"
import (
	"fmt"
	"unsafe"
)

// VP8Encoder wraps libvpx VP8 encoder
type VP8Encoder struct {
	ctx    C.vpx_codec_ctx_t
	cfg    C.vpx_codec_enc_cfg_t
	width  int
	height int
	fps    int
}

// NewVP8Encoder creates a new VP8 encoder
func NewVP8Encoder(width, height, fps, bitrate int) (*VP8Encoder, error) {
	encoder := &VP8Encoder{
		width:  width,
		height: height,
		fps:    fps,
	}

	// Get default codec configuration
	iface := C.vpx_codec_vp8_cx()
	res := C.vpx_codec_enc_config_default(iface, &encoder.cfg, 0)
	if res != C.VPX_CODEC_OK {
		return nil, fmt.Errorf("failed to get default config: %d", res)
	}

	// Configure encoder for low-latency real-time streaming
	encoder.cfg.g_w = C.uint(width)
	encoder.cfg.g_h = C.uint(height)
	encoder.cfg.g_timebase.num = 1
	encoder.cfg.g_timebase.den = C.int(fps)
	encoder.cfg.rc_target_bitrate = C.uint(bitrate) // in kbps
	encoder.cfg.g_error_resilient = 1
	encoder.cfg.g_lag_in_frames = 0 // Zero lag for real-time
	encoder.cfg.kf_mode = C.VPX_KF_AUTO
	encoder.cfg.kf_min_dist = 0
	encoder.cfg.kf_max_dist = C.uint(fps) // Keyframe every second for faster recovery

	// Initialize encoder (use _ver function since vpx_codec_enc_init is a macro)
	res = C.vpx_codec_enc_init_ver(&encoder.ctx, iface, &encoder.cfg, 0, C.VPX_ENCODER_ABI_VERSION)
	if res != C.VPX_CODEC_OK {
		return nil, fmt.Errorf("failed to initialize encoder: %d", res)
	}

	return encoder, nil
}

// Encode encodes a raw RGBA frame to VP8
func (e *VP8Encoder) Encode(frameData []byte, frameCount int) ([]byte, error) {
	if len(frameData) != e.width*e.height*4 {
		return nil, fmt.Errorf("invalid frame size: expected %d, got %d", e.width*e.height*4, len(frameData))
	}

	if frameCount == 0 {
		fmt.Printf("[VP8Encoder] Starting encode of first frame...\n")
	}

	// Allocate vpx_image
	var img C.vpx_image_t
	if C.vpx_img_alloc(&img, C.VPX_IMG_FMT_I420, C.uint(e.width), C.uint(e.height), 1) == nil {
		return nil, fmt.Errorf("failed to allocate image")
	}
	defer C.vpx_img_free(&img)

	// Convert RGBA to I420 (YUV420)
	e.rgbaToI420(frameData, &img)

	// Encode frame (let encoder decide keyframes based on config)
	flags := C.int(0)

	res := C.vpx_codec_encode(&e.ctx, &img, C.vpx_codec_pts_t(frameCount), 1, C.vpx_enc_frame_flags_t(flags), C.VPX_DL_REALTIME)
	if res != C.VPX_CODEC_OK {
		return nil, fmt.Errorf("failed to encode frame: %d", res)
	}

	// Get encoded packets
	var iter C.vpx_codec_iter_t
	var encodedData []byte
	packetCount := 0

	for {
		pkt := C.vpx_codec_get_cx_data(&e.ctx, &iter)
		if pkt == nil {
			break
		}

		if pkt.kind == C.VPX_CODEC_CX_FRAME_PKT {
			size := int(C.get_frame_sz(pkt))
			data := C.GoBytes(C.get_frame_buf(pkt), C.int(size))
			encodedData = append(encodedData, data...)
			packetCount++
		}
	}

	if frameCount == 0 {
		fmt.Printf("[VP8Encoder] Encoded first frame: %d packets, %d total bytes\n", packetCount, len(encodedData))
	}

	return encodedData, nil
}

// rgbaToI420 converts RGBA to I420 (YUV420) format
func (e *VP8Encoder) rgbaToI420(rgba []byte, img *C.vpx_image_t) {
	width := e.width
	height := e.height

	// Get plane pointers
	yPlane := (*[1 << 30]byte)(unsafe.Pointer(img.planes[0]))[:width*height]
	uPlane := (*[1 << 30]byte)(unsafe.Pointer(img.planes[1]))[:width*height/4]
	vPlane := (*[1 << 30]byte)(unsafe.Pointer(img.planes[2]))[:width*height/4]

	// Convert RGBA to YUV
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			idx := (y*width + x) * 4
			r := int(rgba[idx])
			g := int(rgba[idx+1])
			b := int(rgba[idx+2])

			// RGB to YUV conversion (ITU-R BT.601)
			yVal := ((66*r + 129*g + 25*b + 128) >> 8) + 16
			uVal := ((-38*r - 74*g + 112*b + 128) >> 8) + 128
			vVal := ((112*r - 94*g - 18*b + 128) >> 8) + 128

			// Clamp values
			if yVal < 0 {
				yVal = 0
			} else if yVal > 255 {
				yVal = 255
			}
			if uVal < 0 {
				uVal = 0
			} else if uVal > 255 {
				uVal = 255
			}
			if vVal < 0 {
				vVal = 0
			} else if vVal > 255 {
				vVal = 255
			}

			// Write Y
			yPlane[y*width+x] = byte(yVal)

			// Write U and V (subsampled 2x2)
			if y%2 == 0 && x%2 == 0 {
				uvIdx := (y/2)*(width/2) + (x / 2)
				uPlane[uvIdx] = byte(uVal)
				vPlane[uvIdx] = byte(vVal)
			}
		}
	}
}

// Close releases encoder resources
func (e *VP8Encoder) Close() error {
	if res := C.vpx_codec_destroy(&e.ctx); res != C.VPX_CODEC_OK {
		return fmt.Errorf("failed to destroy encoder: %d", res)
	}
	return nil
}
