/**
 * Block Components
 *
 * React components for all block types
 * These are placeholder implementations that will be fleshed out later
 */

import React from 'react'
import type {
  SectionProps,
  GridProps,
  StackProps,
  ContainerProps,
  TextProps,
  ImageProps,
  ButtonProps,
  IconProps,
  DividerProps,
  SpacerProps,
  ListProps,
  TableProps,
  CardGridProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  CheckboxGroupProps,
  RadioGroupProps,
  FileUploadProps,
  SwitchProps,
  SliderProps,
  DatePickerProps,
  RichTextEditorProps,
  SubmitButtonProps,
  FormProps,
  TicketCreateWidgetProps,
  TicketListWidgetProps,
  IncidentStatusWidgetProps,
  KBSearchWidgetProps,
  ServiceCatalogWidgetProps,
  AnnouncementBannerProps,
  UserProfileWidgetProps,
} from '../schemas'

// ============================================
// Container Components
// ============================================

export const SectionBlock: React.FC<SectionProps & { children?: React.ReactNode }> = (props) => {
  return <section className={props.className}>{props.children}</section>
}

export const GridBlock: React.FC<GridProps & { children?: React.ReactNode }> = (props) => {
  return <div className={props.className}>{props.children}</div>
}

export const StackBlock: React.FC<StackProps & { children?: React.ReactNode }> = (props) => {
  return <div className={props.className}>{props.children}</div>
}

export const ContainerBlock: React.FC<ContainerProps & { children?: React.ReactNode }> = (props) => {
  const Tag = props.tag || 'div'
  return <Tag className={props.className}>{props.children}</Tag>
}

// ============================================
// Content Components
// ============================================

export const TextBlock: React.FC<TextProps> = (props) => {
  return <div className={props.className}>{props.content}</div>
}

export const ImageBlock: React.FC<ImageProps> = (props) => {
  return <img src={props.src} alt={props.alt} className={props.className} />
}

export const ButtonBlock: React.FC<ButtonProps> = (props) => {
  return <button className={props.className}>{props.text}</button>
}

export const IconBlock: React.FC<IconProps> = (props) => {
  return <div className={props.className}>{props.name}</div>
}

export const DividerBlock: React.FC<DividerProps> = (props) => {
  return <hr className={props.className} />
}

export const SpacerBlock: React.FC<SpacerProps> = (props) => {
  return <div className={props.className} />
}

// ============================================
// Data Components
// ============================================

export const ListBlock: React.FC<ListProps & { children?: React.ReactNode }> = (props) => {
  return <div className={props.className}>{props.children}</div>
}

export const TableBlock: React.FC<TableProps> = (props) => {
  return <table className={props.className}></table>
}

export const CardGridBlock: React.FC<CardGridProps> = (props) => {
  return <div className={props.className}></div>
}

// ============================================
// Form Components
// ============================================

export const InputBlock: React.FC<InputProps> = (props) => {
  return <input type={props.type} name={props.name} className={props.className} />
}

export const TextareaBlock: React.FC<TextareaProps> = (props) => {
  return <textarea name={props.name} rows={props.rows} className={props.className} />
}

export const SelectBlock: React.FC<SelectProps> = (props) => {
  return (
    <select name={props.name} className={props.className}>
      {props.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export const CheckboxBlock: React.FC<CheckboxProps> = (props) => {
  return <input type="checkbox" name={props.name} className={props.className} />
}

export const CheckboxGroupBlock: React.FC<CheckboxGroupProps> = (props) => {
  return <div className={props.className}></div>
}

export const RadioGroupBlock: React.FC<RadioGroupProps> = (props) => {
  return <div className={props.className}></div>
}

export const FileUploadBlock: React.FC<FileUploadProps> = (props) => {
  return <input type="file" name={props.name} className={props.className} />
}

export const SwitchBlock: React.FC<SwitchProps> = (props) => {
  return <input type="checkbox" name={props.name} className={props.className} />
}

export const SliderBlock: React.FC<SliderProps> = (props) => {
  return <input type="range" name={props.name} min={props.min} max={props.max} step={props.step} className={props.className} />
}

export const DatePickerBlock: React.FC<DatePickerProps> = (props) => {
  return <input type="date" name={props.name} className={props.className} />
}

export const RichTextEditorBlock: React.FC<RichTextEditorProps> = (props) => {
  return <div className={props.className}>Rich Text Editor Placeholder</div>
}

export const SubmitButtonBlock: React.FC<SubmitButtonProps> = (props) => {
  return <button type="submit" className={props.className}>{props.text}</button>
}

export const FormBlock: React.FC<FormProps & { children?: React.ReactNode }> = (props) => {
  return <form action={props.action} method={props.method} className={props.className}>{props.children}</form>
}

// ============================================
// Widget Components
// ============================================

export const TicketCreateWidget: React.FC<TicketCreateWidgetProps> = (props) => {
  return <div className={props.className}>Ticket Create Widget Placeholder</div>
}

export const TicketListWidget: React.FC<TicketListWidgetProps> = (props) => {
  return <div className={props.className}>Ticket List Widget Placeholder</div>
}

export const IncidentStatusWidget: React.FC<IncidentStatusWidgetProps> = (props) => {
  return <div className={props.className}>Incident Status Widget Placeholder</div>
}

export const KBSearchWidget: React.FC<KBSearchWidgetProps> = (props) => {
  return <div className={props.className}>Knowledge Base Search Widget Placeholder</div>
}

export const ServiceCatalogWidget: React.FC<ServiceCatalogWidgetProps> = (props) => {
  return <div className={props.className}>Service Catalog Widget Placeholder</div>
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = (props) => {
  return <div className={props.className}>{props.message}</div>
}

export const UserProfileWidget: React.FC<UserProfileWidgetProps> = (props) => {
  return <div className={props.className}>User Profile Widget Placeholder</div>
}
