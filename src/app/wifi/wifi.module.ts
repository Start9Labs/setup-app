import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WifiPage } from './wifi.page';
declare var WifiWizard2: any;

const routes: Routes = [
  {
    path: '',
    component: WifiPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WifiPage]
})
export class WifiPageModule {}
