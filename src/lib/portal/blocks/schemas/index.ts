/**
 * Block Schemas Index
 *
 * Exports all Zod schemas for block validation
 */

// Container blocks
export {
  sectionPropsSchema,
  gridPropsSchema,
  stackPropsSchema,
  containerPropsSchema,
  type SectionProps,
  type GridProps,
  type StackProps,
  type ContainerProps,
} from './container'

// Content blocks
export {
  textPropsSchema,
  imagePropsSchema,
  buttonPropsSchema,
  iconPropsSchema,
  dividerPropsSchema,
  spacerPropsSchema,
  type TextProps,
  type ImageProps,
  type ButtonProps,
  type IconProps,
  type DividerProps,
  type SpacerProps,
} from './content'

// Data blocks
export {
  listPropsSchema,
  tablePropsSchema,
  cardGridPropsSchema,
  type ListProps,
  type TableProps,
  type CardGridProps,
} from './data'

// Form blocks
export {
  inputPropsSchema,
  textareaPropsSchema,
  selectPropsSchema,
  checkboxPropsSchema,
  checkboxGroupPropsSchema,
  radioGroupPropsSchema,
  fileUploadPropsSchema,
  switchPropsSchema,
  sliderPropsSchema,
  datePickerPropsSchema,
  richTextEditorPropsSchema,
  submitButtonPropsSchema,
  formPropsSchema,
  type InputProps,
  type TextareaProps,
  type SelectProps,
  type CheckboxProps,
  type CheckboxGroupProps,
  type RadioGroupProps,
  type FileUploadProps,
  type SwitchProps,
  type SliderProps,
  type DatePickerProps,
  type RichTextEditorProps,
  type SubmitButtonProps,
  type FormProps,
} from './form'

// Widget blocks
export {
  ticketCreateWidgetPropsSchema,
  ticketListWidgetPropsSchema,
  incidentStatusWidgetPropsSchema,
  kbSearchWidgetPropsSchema,
  serviceCatalogWidgetPropsSchema,
  announcementBannerPropsSchema,
  userProfileWidgetPropsSchema,
  type TicketCreateWidgetProps,
  type TicketListWidgetProps,
  type IncidentStatusWidgetProps,
  type KBSearchWidgetProps,
  type ServiceCatalogWidgetProps,
  type AnnouncementBannerProps,
  type UserProfileWidgetProps,
} from './widget'
