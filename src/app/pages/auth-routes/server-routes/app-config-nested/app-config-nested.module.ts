import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { IonicModule } from '@ionic/angular'

import { AppConfigNestedPage } from './app-config-nested.page'
import { ObjectConfigComponentModule } from 'src/app/components/object-config/object-config.components.module'

@NgModule({
  imports: [
    ObjectConfigComponentModule,
    CommonModule,
    IonicModule,
  ],
  declarations: [AppConfigNestedPage],
})
export class AppConfigNestedPageModule { }
