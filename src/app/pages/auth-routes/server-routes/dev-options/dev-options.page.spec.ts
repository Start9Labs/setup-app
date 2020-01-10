import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { DevOptionsPage } from './dev-options.page'

describe('DevOptionsPage', () => {
  let component: DevOptionsPage
  let fixture: ComponentFixture<DevOptionsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DevOptionsPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(DevOptionsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
