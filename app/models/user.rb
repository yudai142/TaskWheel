# frozen_string_literal: true
# encoding: utf-8

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  has_many :worksheets, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  # Google OmniAuthコールバック時にユーザーを検索または作成
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email    = auth.info.email
      user.name     = auth.info.name
      user.password = Devise.friendly_token[0, 20]
      user.provider = auth.provider
      user.uid      = auth.uid
    end
  end

  def display_name
    name.presence || email
  end
end
