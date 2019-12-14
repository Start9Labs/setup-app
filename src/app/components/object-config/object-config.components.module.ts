import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ObjectConfigComponent } from './object-config.component'
import { IonicModule } from '@ionic/angular'

@NgModule({
  declarations: [
    ObjectConfigComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports: [ObjectConfigComponent],
})
export class ObjectConfigComponentModule { }
