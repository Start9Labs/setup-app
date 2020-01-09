import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { SSHKeysPage } from './ssh-keys.page'

describe('SSHKeysPage', () => {
  let component: SSHKeysPage
  let fixture: ComponentFixture<SSHKeysPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SSHKeysPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(SSHKeysPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
