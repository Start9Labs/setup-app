import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AppConfigValuePage } from './app-config-value.page'

describe('AppConfigValuePage', () => {
  let component: AppConfigValuePage
  let fixture: ComponentFixture<AppConfigValuePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppConfigValuePage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(AppConfigValuePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
