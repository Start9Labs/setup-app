import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { AppConfigValuePage } from './app-config-value.page'

@NgModule({
  declarations: [AppConfigValuePage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  entryComponents: [AppConfigValuePage],
  exports: [AppConfigValuePage],
})
export class AppConfigValuePageModule { }
