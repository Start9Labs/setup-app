import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { DeveloperOptionsPage } from './developer-options.page'

describe('DeveloperOptionsPage', () => {
  let component: DeveloperOptionsPage
  let fixture: ComponentFixture<DeveloperOptionsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeveloperOptionsPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(DeveloperOptionsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
