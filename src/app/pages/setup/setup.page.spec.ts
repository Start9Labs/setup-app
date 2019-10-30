import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { SetupPage } from './setup.page'

describe('SetupPage', () => {
  let component: SetupPage
  let fixture: ComponentFixture<SetupPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SetupPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(SetupPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
