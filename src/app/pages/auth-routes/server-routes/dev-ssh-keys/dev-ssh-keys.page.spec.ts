import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { DevSSHKeysPage } from './dev-ssh-keys.page'

describe('DevSSHKeysPage', () => {
  let component: DevSSHKeysPage
  let fixture: ComponentFixture<DevSSHKeysPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DevSSHKeysPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(DevSSHKeysPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
