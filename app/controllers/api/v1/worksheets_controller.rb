# frozen_string_literal: true

module Api
  module V1
    class WorksheetsController < BaseController
      def index
        worksheets = current_user.worksheets.order(created_at: :asc)
        render json: worksheets.map { |worksheet| serialize_worksheet(worksheet) }
      end

      def create
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.build(worksheet_params)
        if worksheet.save
          render json: serialize_worksheet(worksheet), status: :created
        else
          render json: { errors: worksheet.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        worksheet = current_user.worksheets.find(params[:id])
        render json: serialize_worksheet(worksheet)
      end

      def update
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.find(params[:id])
        if worksheet.update(worksheet_params)
          render json: serialize_worksheet(worksheet), status: :ok
        else
          render json: { errors: worksheet.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.find(params[:id])
        worksheet.destroy
        head :no_content
      end

      def set_current
        worksheet = current_user.worksheets.find(params[:worksheet_id])
        session[:current_worksheet_id] = worksheet.id
        render json: {
          current_worksheet: serialize_worksheet(worksheet)
        }
      end

      def importable
        # 現在のワークシート ID を取得
        current_ws_id = session[:current_worksheet_id]
        
        # 現在のユーザーのワークシート一覧を取得（現在選択中以外）
        worksheets = current_user.worksheets.order(:created_at)
        worksheets = worksheets.where.not(id: current_ws_id) if current_ws_id.present?
        
        render json: worksheets.map { |worksheet| serialize_worksheet(worksheet) }
      end

      def assign_member
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.find(params[:worksheet_id])
        member_id = params[:member_id]
        work_id = params[:work_id]

        Rails.logger.info "Assigning member: worksheet=#{params[:worksheet_id]}, member=#{member_id}, work=#{work_id}"

        # メンバーとワークを検証
        member = worksheet.members.find_by(id: member_id)
        work = worksheet.works.find_by(id: work_id)

        Rails.logger.info "Found member: #{member.present?}, work: #{work.present?}"

        unless member && work
          render json: { error: 'メンバーまたはタスクが見つかりません' }, status: :not_found
          return
        end

        # 今日の日付を取得
        today = Date.today

        # 既存の割り当てを確認（work_id = null のもののみ）
        existing_history =
          History.find_by(member_id:, date: today, work_id: nil, worksheet_id: worksheet.id)

        Rails.logger.info "Found existing history: #{existing_history.present?}"

        if existing_history
          # 既存の割り当てを更新
          existing_history.update!(work_id:)
        else
          # 新しい割り当てを作成
          History.create!(
            member_id:,
            work_id:,
            date: today,
            worksheet_id: worksheet.id
          )
        end

        render json: { member_id:, work_id: }, status: :ok
      rescue StandardError => e
        Rails.logger.error "Assignment error: #{e.message}"
        render json: { error: e.message }, status: :internal_server_error
      end

      private

      def worksheet_params
        params.require(:worksheet).permit(:name, :interval, :week_use, :week)
      end

      def serialize_worksheet(worksheet)
        {
          id: worksheet.id,
          name: worksheet.name,
          interval: worksheet.interval,
          week_use: worksheet.week_use,
          week: worksheet.week
        }
      end
    end
  end
end
