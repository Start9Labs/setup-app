import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { KeychainRestorePage } from './keychain-restore.page'

describe('KeychainRestorePage', () => {
  let component: KeychainRestorePage
  let fixture: ComponentFixture<KeychainRestorePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeychainRestorePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(KeychainRestorePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
