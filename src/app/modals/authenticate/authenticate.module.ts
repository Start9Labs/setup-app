import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { AuthenticatePage } from './authenticate.page'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [AuthenticatePage],
  entryComponents: [AuthenticatePage],
  exports: [AuthenticatePage],
})
export class AuthenticatePageModule { }
