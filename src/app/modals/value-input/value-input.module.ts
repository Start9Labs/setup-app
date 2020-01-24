import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { ValueInputPage } from './value-input.page'

@NgModule({
  declarations: [ValueInputPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  entryComponents: [ValueInputPage],
  exports: [ValueInputPage],
})
export class ValueInputPageModule { }
