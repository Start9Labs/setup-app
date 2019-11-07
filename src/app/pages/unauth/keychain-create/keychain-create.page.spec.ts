import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { KeychainCreatePage } from './keychain-create.page'

describe('KeychainCreatePage', () => {
  let component: KeychainCreatePage
  let fixture: ComponentFixture<KeychainCreatePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeychainCreatePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(KeychainCreatePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
