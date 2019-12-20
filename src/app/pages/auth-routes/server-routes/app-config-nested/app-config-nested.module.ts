import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { IonicModule } from '@ionic/angular'

import { AppConfigNestedPage } from './app-config-nested.page'
import { ObjectConfigComponentModule } from 'src/app/components/object-config/object-config.components.module'

@NgModule({
  declarations: [AppConfigNestedPage],
  imports: [
    ObjectConfigComponentModule,
    CommonModule,
    IonicModule,
  ],
  entryComponents: [AppConfigNestedPage],
  exports: [AppConfigNestedPage],
})
export class AppConfigNestedPageModule { }
