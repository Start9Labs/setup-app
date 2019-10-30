import { Component, OnInit } from '@angular/core'
import { Start9Server } from 'src/types/misc'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'page-manage',
  templateUrl: 'manage.page.html',
  styleUrls: ['manage.page.scss'],
})
export class ManagePage implements OnInit {
  server: Start9Server
  edited = false

  constructor (
    public route: ActivatedRoute,
    public dataService: DataService,
    public navController: NavController,
  ) { }

  ngOnInit () {
    const zeroconfHostname = this.route.snapshot.paramMap.get('zeroconfHostname')
    this.server = this.dataService.getServer(zeroconfHostname)
  }

  async ionViewWillLeave () {
    if (this.edited) {
      await this.dataService.saveServer(this.server)
    }
  }

  async forget () {
    this.edited = false
    await this.dataService.forgetServer(this.server.zeroconfHostname)
    await this.navController.navigateRoot(['/dashboard'])
  }

}
